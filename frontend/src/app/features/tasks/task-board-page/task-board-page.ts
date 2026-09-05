import { Component } from '@angular/core';
import { TaskBoard } from '../task-board/task-board';

@Component({
  selector: 'app-task-board-page',
  imports: [TaskBoard],
  templateUrl: './task-board-page.html',
  styleUrl: './task-board-page.scss',
})
export class TaskBoardPage {}
