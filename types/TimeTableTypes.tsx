export interface TimetableData {
    date: string;
    session: 'morning' | 'afternoon' | 'evening';
    teamId: string;
    class: ClassElementProps;
}

export interface ClassElementProps {
    subject: string;
    lecturer: string;
    location: string;
}

export interface DateRange {
    from: Date;
    to: Date;
}
