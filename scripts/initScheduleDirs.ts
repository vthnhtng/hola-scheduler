import fs from 'fs';
import path from 'path';

// Danh sách các team, có thể chỉnh sửa theo nhu cầu
const teams = ['Team 1', 'Team 2', 'Team 3', 'Team 4'];
const subDirs = ['Done', 'Scheduled', 'Temp'];

const schedulesBase = path.join(__dirname, '../schedules');
const resourceUtils = path.join(__dirname, '../resource/utils');

// Tạo thư mục cho từng team và các thư mục con
teams.forEach(team => {
  const teamPath = path.join(schedulesBase, team);
  if (!fs.existsSync(teamPath)) {
    fs.mkdirSync(teamPath, { recursive: true });
    console.log(`Created: ${teamPath}`);
  }
  subDirs.forEach(sub => {
    const subPath = path.join(teamPath, sub);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
      console.log(`Created: ${subPath}`);
    }
  });
});

// Tạo resource/utils
if (!fs.existsSync(resourceUtils)) {
  fs.mkdirSync(resourceUtils, { recursive: true });
  console.log(`Created: ${resourceUtils}`);
} else {
  console.log(`Exists: ${resourceUtils}`);
} 