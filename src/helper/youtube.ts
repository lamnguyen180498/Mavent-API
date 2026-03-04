import get from 'axios';

interface YoutubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
  categoryId: string;
  liveBroadcastContent: string;
  defaultLanguage: string;
  localized: {
    title: string;
    description: string;
  };
  defaultAudioLanguage: string;
}

interface YoutubeContentDetails {
  duration: string;
  dimension: string;
  definition: string;
  caption: string;
  licensedContent: boolean;
  contentRating: unknown;
  projection: string;
}

interface YoutubeItem {
  kind: string;
  etag: string;
  id: string;
  snippet: YoutubeSnippet;
  contentDetails: YoutubeContentDetails;
}

export default class Youtube {
  getVideoIdFromUrl(url: string) {
    const regex =
      /^(?:http(?:s)?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:(?:watch)?\?(?:.*&)?v(?:i)?=|(?:embed|shorts|v|vi|user)\/))([^\?&\"'<> #]+)/;
    const match = this.handleShortLink(url).match(regex);

    if (match) {
      return match[1];
    } else {
      return null;
    }
  }

  handleShortLink(link: string) {
    const regex =
      /^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/;

    if (regex.test(link)) {
      link = link.replace('shorts', 'embed');
    }

    return link;
  }

  // Example: PT20M6S -> 1206 seconds
  handleDuration(time: string) {
    const hours = (time.match(/\d{1,2}H/) || [])[0] || '0';
    const minutes = (time.match(/\d{1,2}M/) || [])[0] || '0';
    const seconds = (time.match(/\d{1,2}S/) || [])[0] || '0';

    const duration = {
      hours: hours.slice(0, -1) || '0',
      minutes: minutes.slice(0, -1) || '0',
      seconds: seconds.slice(0, -1) || '0',
    };

    return (
      parseInt(duration.hours) * 60 * 60 +
      parseInt(duration.minutes) * 60 +
      parseInt(duration.seconds)
    );
  }

  async getVideoInfo(apiKey: string, videoId: string) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=contentDetails,snippet`;

    try {
      const { data } = await get(apiUrl);
      return data.items[0] as YoutubeItem;
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
