export type EquipmentStatus = {
  available: number;
  maintenance: number;
};

export type ZoneEquipment = {
  name: string;
  count: number;
  status: EquipmentStatus;
};

export type ZoneResource = {
  zoneName: string;
  peopleAssigned: number;
  equipments: ZoneEquipment[];
};

/** 자원현황 더미 데이터 (추후 API 연동 예정) */
export const MOCK_ZONE_RESOURCES: ZoneResource[] = [
  {
    zoneName: "북구",
    peopleAssigned: 6,
    equipments: [
      { name: "노면 진공 청소기", count: 2, status: { available: 1, maintenance: 1 } },
      { name: "복합식 준설차량", count: 1, status: { available: 0, maintenance: 1 } },
    ],
  },
  {
    zoneName: "중구",
    peopleAssigned: 5,
    equipments: [
      { name: "노면 진공 청소기", count: 2, status: { available: 1, maintenance: 1 } },
      { name: "복합식 준설차량", count: 1, status: { available: 1, maintenance: 0 } },
    ],
  },
  {
    zoneName: "서구",
    peopleAssigned: 4,
    equipments: [
      { name: "노면 진공 청소기", count: 2, status: { available: 1, maintenance: 1 } },
      { name: "복합식 준설차량", count: 1, status: { available: 0, maintenance: 1 } },
    ],
  },
  {
    zoneName: "남구",
    peopleAssigned: 7,
    equipments: [
      { name: "노면 진공 청소기", count: 2, status: { available: 1, maintenance: 1 } },
      { name: "복합식 준설차량", count: 1, status: { available: 0, maintenance: 1 } },
    ],
  },
];

