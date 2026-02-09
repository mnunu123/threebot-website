import { redirect } from "next/navigation";

/**
 * /district-map → / 리다이렉트 (시군구 경계는 Overview 지도에 통합됨)
 */
export default function DistrictMapPage() {
  redirect("/");
}
