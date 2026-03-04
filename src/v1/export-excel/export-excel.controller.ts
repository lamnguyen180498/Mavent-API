import { Controller } from '@nestjs/common';
import { ExportExcelService } from './export-excel.service';

@Controller('export-excel')
export class ExportExcelController {
  constructor(private readonly exportExcelService: ExportExcelService) {}
}
