import { TestBed } from '@angular/core/testing';

import { ConfirmationDialogServiceService } from './confirmation-dialog-service.service';

describe('ConfirmationDialogServiceService', () => {
  let service: ConfirmationDialogServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmationDialogServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
