import { PipeTransform, UnprocessableEntityException } from '@nestjs/common';
import z from 'zod';

// quy định class nào muốn làm làm pipe thì phải có hàm transform
export class ZodValidationPipe implements PipeTransform {
  // Pipe này không gắn chặt với 1 schema cụ thể nào
  // z.ZodType là kiểu chung cho mọi schema Zod, nên schema nào cũng truyền vào được
  constructor(private readonly schema: z.ZodType) {}
  // Nest tự gọi hàm này. Vì pipe được gắn vào @Body() (trong controller), nên value chính là
  // body của request, kiểu unkown là vì client có thể gửi lên bất cứ thứ gì: thiếu file, sai kiểu,...
  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new UnprocessableEntityException({
        message: 'Dữ liệu không hợp lệ!',
        errors: result.error?.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
