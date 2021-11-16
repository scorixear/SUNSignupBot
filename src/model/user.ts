export default class User {
  public userId: string;
  public name: string;
  public weapon1: string;
  public weapon2: string;
  public role: string;
  public guild: string;
  public level: number;
  public gearscore: number;

  constructor(userId: string, name?: string, weapon1?: string, weapon2?: string, role?: string, guild?: string, level?: number, gearscore?: number) {
    this.userId = userId;
    this.name = name;
    this.weapon1 = weapon1;
    this.weapon2 = weapon2;
    this.role = role;
    this.guild = guild;
    this.level = level;
    this.gearscore = gearscore;
  }
}