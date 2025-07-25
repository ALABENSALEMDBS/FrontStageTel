import { TestBed } from '@angular/core/testing';

import { GestionreclamationService } from './gestionreclamation.service';

describe('GestionreclamationService', () => {
  let service: GestionreclamationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionreclamationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
