import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotateursComponent } from './annotateurs.component';

describe('AnnotateursComponent', () => {
  let component: AnnotateursComponent;
  let fixture: ComponentFixture<AnnotateursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnnotateursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotateursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
