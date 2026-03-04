import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import get, { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { createWriteStream, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { jws } from 'jsrsasign';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for creating a Zoom meeting
 * Ref: https://marketplace.zoom.us/docs/api-reference/zoom-api/methods/#operation/meetingCreate
 */
export interface CreateMeetingPayload {
  // 1 - An instant meeting.
  // 2 - A scheduled meeting.
  // 3 - A recurring meeting with no fixed time.
  // 8 - A recurring meeting with fixed time.
  // 10 - A screen share only meeting.
  type?: 1 | 2 | 3 | 8 | 10;
  start_time?: string;
  duration?: number; // minutes
  schedule_for?: string; // email or user ID
  timezone?: string;
  password?: string; // max 10
  agenda?: string; // max 2000
  topic: string; // max 200
  recurrence?: {
    // 1 - Daily.
    // 2 - Weekly.
    // 3 - Monthly.
    type: 1 | 2 | 3;
    repeat_interval?: number; // max 90 days, 50 weeks or 10 months
    // 1 - Sunday.
    // 2 - Monday.
    // 3 - Tuesday.
    // 4 - Wednesday.
    // 5 - Thursday.
    // 6 - Friday.
    // 7 - Saturday.
    weekly_days?: string;
    monthly_day?: number; // default 1, range 1-31
    // -1 - Last week of the month.
    // 1 - First week of the month.
    // 2 - Second week of the month.
    // 3 - Third week of the month.
    // 4 - Fourth week of the month.
    monthly_week?: number;
    // 1 - Sunday.
    // 2 - Monday.
    // 3 - Tuesday.
    // 4 - Wednesday.
    // 5 - Thursday.
    // 6 - Friday.
    // 7 - Saturday.
    monthly_week_day?: number;
    end_times?: number; // max 60, default 1
    end_date_time?: string;
  };
  settings?: {
    host_video?: boolean;
    participant_video?: boolean;
    jbh_time?: 0 | 5 | 10 | 15;
    join_before_host?: boolean;
    mute_upon_entry?: boolean;
    watermark?: boolean;
    use_pmi?: boolean;
    // 0 - Automatically approve registration.
    // 1 - Manually approve registration.
    // 2 - No registration required.
    approval_type?: 0 | 1 | 2;
    audio?: 'both' | 'telephony' | 'voip';
    auto_recording?: 'local' | 'cloud' | 'none'; // default none
    alternative_hosts?: string; // A semicolon-separated list of the meeting's alternative hosts' email addresses or IDs.
    alternative_hosts_email_notification?: boolean; // Whether to send email notifications to alternative hosts. This value defaults to true.
    close_registration?: boolean; // default false
    waiting_room?: boolean;
    registrants_email_notification?: boolean;
    approved_or_denied_countries_or_regions?: {
      approved_list: string[];
      denied_list: string[];
      enable: boolean;
      method: 'approve' | 'deny';
    };
    authentication_domains?: string;
    authentication_exception?: {
      email: string;
      name: string;
    }[];
    email_notification?: boolean; // default
    focus_mode?: boolean;
  };
}

export interface ZoomMeetingResponse {
  uuid: string;
  id: number;
  host_id: string;
  host_email: string;
  topic: string;
  type: number;
  status: string;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  start_url: string;
  join_url: string;
  password: string;
  h323_password: string;
  pstn_password: string;
  encrypted_password: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    cn_meeting: boolean;
    in_meeting: boolean;
    join_before_host: boolean;
    jbh_time: number;
    mute_upon_entry: boolean;
    watermark: boolean;
    use_pmi: boolean;
    approval_type: number;
    audio: string;
    auto_recording: string;
    enforce_login: boolean;
    enforce_login_domains: string;
    alternative_hosts: string;
    alternative_host_update_polls: boolean;
    close_registration: boolean;
    show_share_button: boolean;
    allow_multiple_devices: boolean;
    registrants_confirmation_email: boolean;
    waiting_room: boolean;
    request_permission_to_unmute_participants: boolean;
    registrants_email_notification: boolean;
    meeting_authentication: boolean;
    encryption_type: string;
    approved_or_denied_countries_or_regions: {
      enable: boolean;
    };
    breakout_room: {
      enable: boolean;
    };
    internal_meeting: boolean;
    continuous_meeting_chat: {
      enable: boolean;
      auto_add_invited_external_users: boolean;
      auto_add_meeting_participants: boolean;
      channel_id: string;
    };
    participant_focused_meeting: boolean;
    push_change_to_calendar: boolean;
    resources: any[]; // or define a more specific type if needed
    allow_host_control_participant_mute_state: boolean;
    alternative_hosts_email_notification: boolean;
    show_join_info: boolean;
    device_testing: boolean;
    focus_mode: boolean;
    meeting_invitees: any[]; // or define a more specific type if needed
    private_meeting: boolean;
    email_notification: boolean;
    host_save_video_order: boolean;
    sign_language_interpretation: {
      enable: boolean;
    };
    email_in_attendee_report: boolean;
  };
  creation_source: string;
  pre_schedule: boolean;
}

/**
 * NestJS service for interacting with Zoom APIs:
 * - JWT auth for API calls
 * - Generate ZAK tokens, start/join URLs
 * - Fetch meeting recordings (including audio-only)
 * - Fetch meeting chat history
 */
@Injectable()
export class ZoomService {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly accountId: string;
  private readonly sdkKey: string;
  private readonly sdkSecret: string;
  private readonly baseUrl: string = 'https://api.zoom.us/v2';
  private authHeader: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.clientId = configService.get<string>('zoom.client_id');
    this.clientSecret = configService.get<string>('zoom.client_secret');
    this.accountId = configService.get<string>('zoom.account_id');
    this.sdkKey = configService.get<string>('zoom.sdk_key');
    this.sdkSecret = configService.get<string>('zoom.sdk_secret');
    this.baseUrl = 'https://api.zoom.us/v2';
  }

  public async getUserInfo(userId = 'me') {
    return this.request('get', `/users/${encodeURIComponent(userId)}`);
  }

  public async getLive(userId = 'me') {
    return this.request(
      'get',
      `/users/${encodeURIComponent(userId)}/meetings?type=live`,
    );
  }

  public async getMeetingInfo(meetingId: string | number) {
    return this.request('get', `/meetings/${meetingId}`);
  }

  /**
   * Create a Zoom meeting for a specific user
   * Ref: POST /users/{userId}/meetings
   */
  public async createMeeting(
    payload: CreateMeetingPayload,
    userId = 'me', // 'me' for current user, or specific user ID
  ): Promise<ZoomMeetingResponse> {
    return this.request(
      'post',
      `/users/${encodeURIComponent(userId)}/meetings`,
      {
        data: payload,
      },
    );
  }

  /**
   * Get ZAK token for a host
   * Ref: GET /users/{userId}/token?token_type=zak
   */
  public async getHostZAKToken(userId = 'me'): Promise<string> {
    const data = await this.request<{ token: string }>(
      'get',
      `/users/${encodeURIComponent(userId)}/token?type=zak`,
    );
    return data.token;
  }

  /**
   * Build host start URL with ZAK
   */
  public getStartUrl(meetingId: string | number, zakToken: string): string {
    return `https://zoom.us/s/${meetingId}?zak=${zakToken}`;
  }

  /**
   * Build guest join URL (no ZAK required)
   */
  public getGuestJoinUrl(
    meetingId: string | number,
    password?: string,
  ): string {
    let url = `https://zoom.us/j/${meetingId}`;
    if (password) {
      url += `?pwd=${encodeURIComponent(password)}`;
    }
    return url;
  }

  /**
   * Fetch all recording files for a meeting
   * Ref: GET /meetings/{meetingId}/recordings
   */
  public async getMeetingRecordings(meetingId: string | number): Promise<any> {
    return this.request('get', `/meetings/${meetingId}/recordings`);
  }

  /**
   * Fetch audio-only recording URLs for a meeting
   */
  public async getAudioRecordings(
    meetingId: string | number,
  ): Promise<string[]> {
    const rec = await this.getMeetingRecordings(meetingId);
    const files = rec.recording_files || [];
    return files
      .filter(
        (f: any) => f.recording_type === 'audio_only' || f.file_type === 'M4A',
      )
      .map((f: any) => f.download_url);
  }

  /**
   * Fetch chat messages for a past meeting
   * Ref: GET /past_meetings/{meetingUUID}/chat/messages
   */
  public async getMeetingChat(meetingUUID: string): Promise<any> {
    return this.request(
      'get',
      `/past_meetings/${encodeURIComponent(meetingUUID)}/chat/messages`,
    );
  }

  /**
   * Get meeting UUID from meetingId (via recordings API)
   */
  public async getMeetingUUID(meetingId: string | number): Promise<string> {
    const rec = await this.getMeetingRecordings(meetingId);
    return rec.uuid;
  }

  /**
   * Save meeting recordings and chat locally
   */
  public async saveMeetingAssetsLocally(
    meetingId: string | number,
    localDir: string = '/storage/zoom/recordings',
  ): Promise<void> {
    const { recording_files = [], uuid } =
      await this.getMeetingRecordings(meetingId);

    mkdirSync(localDir, { recursive: true });

    for (const file of recording_files) {
      const fileName = `${meetingId}_${file.id}_${
        file.recording_type || file.file_type
      }.${file.file_type.toLowerCase()}`;
      const filePath = join(localDir, fileName);

      await this.downloadFile(
        file.download_url,
        filePath,
        this.authHeader.replace('Bearer ', ''),
      );
    }

    try {
      const chat = await this.getMeetingChat(uuid);
      const chatPath = join(localDir, `${meetingId}_chat.json`);
      writeFileSync(chatPath, JSON.stringify(chat, null, 2), 'utf8');
    } catch (err) {
      console.warn(
        `Chat history not available for meeting ${meetingId}:`,
        err.message,
      );
    }
  }

  async generateSignature(meetingNumber: string | number, role = 0) {
    const sdkKey = this.sdkKey;
    const sdkSecret = this.sdkSecret;

    const iat = Math.round(new Date().getTime() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;
    const oHeader = { alg: 'HS256', typ: 'JWT' };

    const oPayload = {
      appKey: sdkKey,
      sdkKey: sdkKey,
      mn: meetingNumber,
      role,
      iat: iat,
      exp: exp,
      tokenExp: exp,
      video_webrtc_mode: 1,
    };

    const sHeader = JSON.stringify(oHeader);
    const sPayload = JSON.stringify(oPayload);
    return jws.JWS.sign('HS256', sHeader, sPayload, sdkSecret);
  }

  private async fetchAccessToken(): Promise<string> {
    // console.log('this.clientId', this.clientId);
    // console.log('this.clientSecret', this.clientSecret);
    const token = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString(
      'base64',
    );
    // console.log('token', token);

    try {
      const res = await this.httpService.axiosRef.post(
        'https://zoom.us/oauth/token',
        null,
        {
          params: {
            grant_type: 'account_credentials',
            account_id: this.accountId,
          },
          headers: {
            Authorization: `Basic ${token}`,
          },
        },
      );

      return res.data.access_token;
    } catch (err) {
      console.log(err);
      return '';
    }
  }

  private async request<T = any>(
    method: 'get' | 'post',
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const token = await this.fetchAccessToken();
      this.authHeader = `Bearer ${token}`;
      // console.log('this.authHeader', this.authHeader);

      const response = await firstValueFrom(
        this.httpService.request<T>({
          method,
          url: `${this.baseUrl}${path}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.authHeader,
          },
          ...config,
        }),
      );
      return response.data;
    } catch (err: any) {
      throw new HttpException(
        err.response?.data || err.message,
        err.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Download file from Zoom to local disk
   */
  private async downloadFile(
    fileUrl: string,
    localPath: string,
    accessToken?: string,
  ): Promise<void> {
    const writer = createWriteStream(localPath);
    const response = await get(fileUrl, {
      responseType: 'stream',
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    });

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}
