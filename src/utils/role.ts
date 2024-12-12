import { getAbsolutePath } from "./getAbsolutePath";
export const controlImage = "./src/resources/images/control-display.png";
export const faceImage = "./src/resources/images/face-display.png";
export const meleeDPSImage = "./src/resources/images/melee-dps-display.png";
export const rangeDPSImage = "./src/resources/images/range-dps-display.png";
export const tankImage = "./src/resources/images/tank-display.png";
export const supportImage = "./src/resources/images/support-display.png";

export const roles = {
  TANK: "tank",
  SUPPORT: "support",
  RANGEDPS: "range dps",
  MELEEDPS: "melee dps",
  FACE: "face",
  CONTROL: "control",
  DM: "dungeon master",
};

export function getRoleImage(role: string) {
  let imagePathSTR = "";
  switch (role.toLowerCase()) {
    case roles.FACE:
      imagePathSTR = faceImage;
      break;
    case roles.CONTROL:
      imagePathSTR = controlImage;
      break;
    case roles.MELEEDPS:
      imagePathSTR = meleeDPSImage;
      break;
    case roles.RANGEDPS:
      imagePathSTR = rangeDPSImage;
      break;
    case roles.SUPPORT:
      imagePathSTR = supportImage;
      break;
    default:
      imagePathSTR = tankImage;
      break;
  }
  return getAbsolutePath(imagePathSTR);
}

export function getRoleName(role: string) {
  switch (role.toLowerCase()) {
    case roles.FACE:
      return "Face";
    case roles.CONTROL:
      return "Control";
    case roles.MELEEDPS:
      return "Melee DPS";
    case roles.RANGEDPS:
      return "Range DPS";
    case roles.SUPPORT:
      return "Support";
    default:
      return "Tank";
  }
}
