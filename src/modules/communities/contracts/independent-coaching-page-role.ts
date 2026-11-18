/** The viewer may coach other people while receiving this agreement as a student. */
export function independentCoachingStudentPage(input:Readonly<{section:string;directory:boolean;viewerId:string;enrollmentStudentId?:string}>) {
 return input.section==='my-coaching'||input.section==='coaches'||input.section==='home'&&input.directory||input.enrollmentStudentId===input.viewerId;
}
