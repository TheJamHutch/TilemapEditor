import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TilingTabComponent } from './tiling-tab.component';

describe('TilingTabComponent', () => {
  let component: TilingTabComponent;
  let fixture: ComponentFixture<TilingTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TilingTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TilingTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
