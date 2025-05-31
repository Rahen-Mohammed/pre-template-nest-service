import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({
    description: 'The title of the todo',
    example: 'Buy groceries',
  })
  title: string;

  @ApiProperty({
    description: 'The description of the todo',
    example: 'Buy groceries for the week',
  })
  description: string;
}
