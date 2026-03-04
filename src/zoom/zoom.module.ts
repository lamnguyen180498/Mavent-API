import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ZoomService } from './zoom.service';

export const ZOOM_CONFIG = 'ZOOM_CONFIG';

@Global()
@Module({
  imports: [HttpModule],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
