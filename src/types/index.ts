// src/types/index.ts

export type Role = "USER" | "SUPERVISOR" | "INSTRUCTOR" | "MANAGER" | "SUBSTITUTE" | "ROTATION";

export type Day = "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";

export type PlacementStatus = "OPEN" | "ASSIGNED" | "CANCELLED";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  idNumber: string;
  phoneNumber: string;
  dateOfBirth: string;
  isWorking: boolean;
  workDays: Day[];
  instructorId?: string;
  supervisorId?: string;
  fixedRotationsAsManager?: FixedRotation[];
  fixedRotationsAsRotation?: FixedRotation[];
}

export interface Institution {
  id: string;
  name: string;
  address: string;
  institutionNumber: string;
  mainManagerId: string;
  instructorId: string;
  supervisorId: string;
  mainManager?: User;
  instructor?: User;
}

export interface Placement {
  id: string;
  date: string;
  status: PlacementStatus;
  institutionId: string;
  institution: Institution;
  mainTeacherId: string;
  mainTeacher: User;
  substituteId?: string;
  substitute?: User;
  notes?: string;
  priority: "NORMAL" | "URGENT";
}

export interface FixedRotation {
  id: string;
  day: Day;
  managerId: string;
  rotationTeacherId: string;
  rotationTeacher?: User;
}
// src\components\AddPlacementModal.tsx
export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  mainManagedInstitutions?: { id: string; name: string }[];
}
export interface RotationRecord {
  rotationTeacher: { id: string; firstName: string; lastName: string };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    mainManagedInstitutions: { id: string; name: string }[];
  };
}


export type FieldKind =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "idNumber"
  | "password"
  | "dateOfBirth";

export type ValidatedName = "email" | "idNumber" | "phoneNumber";

export type BaseConfig = {
  label: string;
  placeholder: string;
  icon: any;
  name: string;
  type?: string;
  useValidation?: false;
};

export type ValidatedConfig = {
  label: string;
  icon: any;
  name: ValidatedName;
  useValidation: true;
};

export type FieldConfig = BaseConfig | ValidatedConfig;
