import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoEntity } from './entities/todo.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IUser } from 'src/users/interfaces/user.interface';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) {}

  async create(createTodoDto: CreateTodoDto, user: IUser) {
    await this.todoRepository.save({
      ...createTodoDto,
      user_id: user.id,
    });
    return {
      message: 'Todo created successfully',
    };
  }

  async findAll(user: IUser) {
    return await this.todoRepository.find({
      where: {
        user_id: user.id,
      },
    });
  }

  async findOne(id: number) {
    const todo = await this.todoRepository.findOne({
      where: {
        id,
      },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    return todo;
  }

  async update(id: number, updateTodoDto: UpdateTodoDto) {
    const todo = await this.todoRepository.findOne({
      where: {
        id,
      },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    await this.todoRepository.update(id, updateTodoDto);

    return {
      message: 'Todo updated successfully',
    };
  }

  async remove(id: number) {
    const todo = await this.todoRepository.findOne({
      where: {
        id,
      },
    });

    if (!todo) {
      throw new NotFoundException('Todo not found');
    }

    await this.todoRepository.delete(id);

    return {
      message: 'Todo deleted successfully',
    };
  }
}
