import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResizeMapDialogComponent } from './resize-map-dialog.component';

describe('ResizeMapDialogComponent', () => {
  let component: ResizeMapDialogComponent;
  let fixture: ComponentFixture<ResizeMapDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResizeMapDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResizeMapDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
