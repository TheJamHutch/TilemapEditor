import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Vector } from 'src/app/core/primitives';
import { EventBusService, EventType } from 'src/app/event-bus.service';

@Component({
  selector: 'app-resize-map-dialog',
  templateUrl: './resize-map-dialog.component.html',
  styleUrls: [
    './resize-map-dialog.component.scss',
    '../../../common/app.common.scss'
  ]
})
export class ResizeMapDialogComponent implements OnInit {

  addNorth: number = 0;
  addEast: number = 0;
  addSouth: number = 0;
  addWest: number = 0;

  get mapDims(): Vector {
    return { x: 100, y: 100 };
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ResizeMapDialogComponent>,
    private eventBus: EventBusService
  ) { }

  ngOnInit(): void {
  }

  onCancelClick(): void {
    this.dialogRef.close();
  }

  onOkClick(): void {
    this.eventBus.raise(EventType.MapResize, {
      addNorth: this.addNorth,
      addEast: this.addEast,
      addSouth: this.addSouth,
      addWest: this.addWest
    });
    this.dialogRef.close();
  }

}
