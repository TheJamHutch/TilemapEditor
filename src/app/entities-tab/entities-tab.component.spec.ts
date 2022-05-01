import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntitiesTabComponent } from './entities-tab.component';

describe('EntitiesTabComponent', () => {
  let component: EntitiesTabComponent;
  let fixture: ComponentFixture<EntitiesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntitiesTabComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitiesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
