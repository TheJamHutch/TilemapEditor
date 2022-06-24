import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorControlComponent } from './editor-control.component';

describe('EditorControlComponent', () => {
  let component: EditorControlComponent;
  let fixture: ComponentFixture<EditorControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditorControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
