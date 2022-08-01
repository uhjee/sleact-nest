import { ApiProperty } from '@nestjs/swagger';

export class JoinRequestDto {
  @ApiProperty({
    example: 'uhjee@gmail.com',
    description: '이메일을 적어주세요',
    required: true,
  })
  public email: string;

  @ApiProperty({
    example: 'uhjee',
    description: '닉네임',
    required: true,
  })
  public nickname: string;

  @ApiProperty({
    example: 'qlalfqjsgh11',
    description: '비밀번호',
    required: true,
  })
  public password: string;
}
