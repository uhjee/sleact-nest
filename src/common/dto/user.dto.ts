import { ApiProperty } from '@nestjs/swagger';
import { SignUpRequestDto } from 'src/users/dto/sign-up.request.dto';

export class UserDto extends SignUpRequestDto {
  @ApiProperty({
    required: true,
    example: 1,
    description: '사용자 아이디',
  })
  id: number;
}
