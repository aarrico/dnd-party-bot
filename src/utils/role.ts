import path from "path";

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
  let image = "";
  switch (role.toLowerCase()) {
    case roles.FACE:
      image = faceImage;
      break;
    case roles.CONTROL:
      image = controlImage;
      break;
    case roles.MELEEDPS:
      image = meleeDPSImage;
      break;
    case roles.RANGEDPS:
      image = rangeDPSImage;
      break;
    case roles.SUPPORT:
      image = supportImage;
      break;
    default:
      image = tankImage;
      break;
  }
  return path.resolve(image).replace(/\//g, "/");
}

export function getRoleSTR(role: string) {
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
