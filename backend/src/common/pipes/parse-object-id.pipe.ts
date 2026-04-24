import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!OBJECT_ID_REGEX.test(value)) {
      throw new BadRequestException('Invalid object id');
    }
    return value;
  }
}
