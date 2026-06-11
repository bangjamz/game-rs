export interface Department {
  level: number
  capacity: number
  staff: number
  requiredStaff: number
}

export interface SpecializedDepartment extends Department {
  name: string
  description: string
  unlockCost: number
}

export interface Loan {
  amount: number
  interestRate: number
  termMonths: number
  monthlyPayment: number
  remainingMonths: number
}

export interface FinancialRecord {
  month: number
  revenue: number
  fixedCosts: number
  variableCosts: number
  totalCosts: number
  profit: number
  patients: number
  cash: number
  marginalCost?: number
  averageTotalCost?: number
  averageVariableCost?: number
  patientSatisfaction?: number
}

export interface PatientStats {
  emergency: number
  generalClinic: number
  inpatient: number
  cardiology?: number
  pediatrics?: number
  surgery?: number
  laboratory?: number
  total: number
}

export interface DepartmentMultiplier {
  patientGrowth: number
  revenue: number
  stability: number
  specialty: number
}

export interface StaffMultipliers {
  patientGrowth: number
  revenue: number
}

export interface GameState {
  managerName: string
  hospitalName: string
  difficulty: string
  startDate: string
  cash: number
  loans: Loan[]
  loansTaken: number
  currentMonth: number
  departments: {
    emergency: Department
    generalClinic: Department
    inpatient: Department
    [key: string]: Department
  }
  unlockedDepartments?: {
    [key: string]: SpecializedDepartment
  }
  lockedDepartments?: {
    [key: string]: SpecializedDepartment
  }
  staff: {
    doctors: number
    nurses: number
    administration: number
    support: number
    [key: string]: number
  }
  patientSatisfaction: number
  satisfactionFactors: {
    staffRatio: number
    facilityQuality: number
    waitingTime: number
    [key: string]: number
  }
  financialHistory: FinancialRecord[]
  patientStats?: PatientStats
  staffMultipliers?: StaffMultipliers
  departmentMultipliers?: {
    [key: string]: DepartmentMultiplier
  }
}
