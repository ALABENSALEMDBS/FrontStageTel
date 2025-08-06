import { TestBed } from '@angular/core/testing';

import { GestionavisService } from './gestionavis.service';

describe('GestionavisService', () => {
  let service: GestionavisService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionavisService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
