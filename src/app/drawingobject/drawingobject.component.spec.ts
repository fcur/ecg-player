import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawingobjectComponent } from './drawingobject.component';

describe('DrawingobjectComponent', () => {
	let component: DrawingobjectComponent;
	let fixture: ComponentFixture<DrawingobjectComponent>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [DrawingobjectComponent]
		})
			.compileComponents();
	}));

	beforeEach(() => {
		fixture = TestBed.createComponent(DrawingobjectComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
