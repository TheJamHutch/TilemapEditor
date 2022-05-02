import { TestBed } from '@angular/core/testing';

import { PerformanceCounterService } from './performance-counter.service';

describe('PerformanceCounterService', () => {
  let service: PerformanceCounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerformanceCounterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
