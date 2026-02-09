import type { StormDrainItem } from "@/types/storm-drain";

import { MOCK_DRAIN_DETAIL } from "@/data/mock-drain-detail";

/** 목업: 빗물받이 목록 (실제 API로 교체 가능, CRI 포함) */
export const MOCK_STORM_DRAINS: StormDrainItem[] = [
  { id: "1", name: "빗물받이 #1", address: "서울시 강남구 테헤란로 123", lat: 37.5012, lng: 127.0396, status: "normal", lastChecked: "2025-02-01", manageNo: "SD-2024-001", installedAt: "2020-03-15", drainageCapacity: 2.5, checkCycleDays: 30, cri: MOCK_DRAIN_DETAIL["1"].cri },
  { id: "2", name: "빗물받이 #2", address: "서울시 강남구 역삼동 456", lat: 37.4989, lng: 127.0378, status: "warning", lastChecked: "2025-02-02", manageNo: "SD-2024-002", installedAt: "2019-07-22", drainageCapacity: 3.0, checkCycleDays: 14, cri: MOCK_DRAIN_DETAIL["2"].cri },
  { id: "3", name: "빗물받이 #3", address: "서울시 서초구 서초동 789", lat: 37.4965, lng: 127.0276, status: "normal", lastChecked: "2025-02-03", manageNo: "SD-2024-003", installedAt: "2021-01-10", drainageCapacity: 2.0, checkCycleDays: 30, cri: MOCK_DRAIN_DETAIL["3"].cri },
  { id: "4", name: "빗물받이 #4", address: "서울시 강남구 삼성동 101", lat: 37.5089, lng: 127.0632, status: "error", lastChecked: "2025-01-28", manageNo: "SD-2024-004", installedAt: "2018-11-05", drainageCapacity: 4.0, checkCycleDays: 7, cri: MOCK_DRAIN_DETAIL["4"].cri },
  { id: "5", name: "빗물받이 #5", address: "서울시 송파구 잠실동 202", lat: 37.5132, lng: 127.1001, status: "normal", lastChecked: "2025-02-04", manageNo: "SD-2024-005", installedAt: "2022-06-20", drainageCapacity: 2.8, checkCycleDays: 30, cri: MOCK_DRAIN_DETAIL["5"].cri },
];
