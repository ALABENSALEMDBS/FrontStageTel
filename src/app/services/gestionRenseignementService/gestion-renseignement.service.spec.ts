import { TestBed } from '@angular/core/testing';

import { GestionRenseignementService } from './gestion-renseignement.service';

describe('GestionRenseignementService', () => {
  let service: GestionRenseignementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionRenseignementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
