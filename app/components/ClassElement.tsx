import { ClassElementProps } from "@/types/TimeTableTypes";

function ClassElement({ subject, lecturer, location }: ClassElementProps) {
    return (
        <div>
            <h1>{subject}</h1>
            <h2>{lecturer}</h2>
            <h3>{location}</h3>
        </div>
    );
}

export default ClassElement;
