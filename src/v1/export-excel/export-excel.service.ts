import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { HydratedDocument } from 'mongoose';
import { Subscribe } from '../../schemas/subscribe.schema';
import ExcelJS from 'exceljs';

export interface ExcelExportOptions<T> {
  filename?: string;
  sheetName?: string;
  columns: { header: string; key: string; width?: number }[];
  data: T[];
}
@Injectable()
export class ExportExcelService {
  async exportToResponse(
    res: Response,
    options: {
      filename: string;
      sheetName: string;
      data:
        | Array<HydratedDocument<Subscribe>>
        | Promise<Array<HydratedDocument<Subscribe>>>;
      columns: { width: number; header: string; key: string }[];
      title?: string;
    },
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(options.sheetName || 'Sheet 1');

    // Merge dòng 1 làm tiêu đề lớn
    const title = options.title || 'DANH SÁCH';
    const totalColumns = options.columns.length;
    const startCol = 'A';
    const endCol = sheet.getColumn(totalColumns).letter;
    sheet.mergeCells(`${startCol}1:${endCol}1`);

    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Set độ rộng cột (nhưng không gán sheet.columns để tránh header nằm dòng 1)
    options.columns.forEach((col, index) => {
      sheet.getColumn(index + 1).width = col.width;
    });

    // Dòng 2: Header tên cột (từ 'header' trong columns)
    sheet.getRow(2).values = options.columns.map((col) => col.header);
    sheet.getRow(2).font = { bold: true };
    sheet.getRow(2).alignment = { vertical: 'middle', horizontal: 'center' };

    // Ghi dữ liệu từ dòng 3
    const rows = await options.data;

    rows.forEach((row) => {
      const doc = row.toObject() as any;

      const rowValues = options.columns.map((col) => {
        const val = doc[col.key];
        return col.key === 'created_at' && val
          ? new Date(val).toLocaleString('vi-VN')
          : val ?? '';
      });

      sheet.addRow(rowValues);
    });

    // Header HTTP
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${options.filename || 'export'}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
