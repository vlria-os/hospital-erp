export const roleDisplayMap = {
  DOCTOR:     '의사',
  RESIDENT:   '레지던트',
  FELLOW:     '전임의',
  PROFESSOR:  '교수',
  NURSE:      '간호사',
  HEAD_NURSE: '수간호사',
  ADMIN:      '관리자',
};

export const displayRole = (roleName) => roleDisplayMap[roleName] ?? roleName ?? '-';

