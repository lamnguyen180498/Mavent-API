import { SetMetadata } from '@nestjs/common';

export const IS_GUEST = 'isGuest';
export const Guest = () => SetMetadata(IS_GUEST, true);
