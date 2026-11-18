import {describe,it,expect} from 'vitest';
import {independentCoachingStudentPage} from './independent-coaching-page-role';
describe('page-specific student role for a dual-role account',()=>{
 it.each(['my-coaching','coaches'])('keeps %s available without own-coach qualification',section=>expect(independentCoachingStudentPage({section,directory:false,viewerId:'viewer'})).toBe(true));
 it.each(['reviews','enrollments'])('uses the original student identity on %s',section=>{
  expect(independentCoachingStudentPage({section,directory:false,viewerId:'viewer',enrollmentStudentId:'viewer'})).toBe(true);
  expect(independentCoachingStudentPage({section,directory:false,viewerId:'viewer',enrollmentStudentId:'another'})).toBe(false);
 });
 it('distinguishes browsing other coaches from the coach work board',()=>{expect(independentCoachingStudentPage({section:'home',directory:true,viewerId:'viewer'})).toBe(true);expect(independentCoachingStudentPage({section:'home',directory:false,viewerId:'viewer'})).toBe(false);});
 it.each(['profile','plans','payments','students','requests','calendar'])('preserves coach qualification for %s',section=>expect(independentCoachingStudentPage({section,directory:false,viewerId:'viewer'})).toBe(false));
});
