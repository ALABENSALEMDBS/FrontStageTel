import { TestBed } from '@angular/core/testing';

import { GestionuserService } from './gestionuser.service';

describe('GestionuserService', () => {
  let service: GestionuserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestionuserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
