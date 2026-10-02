// scripts/install.js
// Sets up Hangly application: initializes user directories, and creates Desktop & Start Menu shortcuts.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Hangly Complete Application Installer ===\n');

const rootDir = path.resolve(__dirname, '..');
const portableExe = path.join(rootDir, 'dist', 'Hangly-Portable.exe');
const unpackedExe = path.join(rootDir, 'dist', 'Hangly-win32-x64', 'Hangly.exe');
const iconPath = path.join(rootDir, 'Assets', 'Icons', 'hangly.ico');

// 1. Prepare AppData directories
console.log('1. Preparing application directories...');
const appDataDirs = [];
if (process.platform === 'win32' && process.env.APPDATA) {
  const baseData = path.join(process.env.APPDATA, 'Hangly');
  const charmsDir = path.join(baseData, 'Charms');
  appDataDirs.push(baseData, charmsDir);
  
  for (const dir of appDataDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✓ Created: ${dir}`);
    } else {
      console.log(`   ✓ Ready: ${dir}`);
    }
  }

  // Ensure default charms.json manifest
  const charmsManifest = path.join(baseData, 'Charms', 'charms.json');
  if (!fs.existsSync(charmsManifest)) {
    fs.writeFileSync(charmsManifest, JSON.stringify([], null, 2));
    console.log(`   ✓ Initialized charms manifest: ${charmsManifest}`);
  }
}

// 2. Identify target executable
console.log('\n2. Verifying executable binary...');
let targetExe = null;
if (fs.existsSync(portableExe)) {
  targetExe = portableExe;
  console.log(`   ✓ Found standalone executable: ${portableExe}`);
} else if (fs.existsSync(unpackedExe)) {
  targetExe = unpackedExe;
  console.log(`   ✓ Found unpacked executable: ${unpackedExe}`);
} else {
  console.log('   ℹ Standalone executable not found in dist/. Building now...');
  try {
    execSync('npm run build:portable', { cwd: rootDir, stdio: 'inherit' });
    if (fs.existsSync(portableExe)) {
      targetExe = portableExe;
      console.log(`   ✓ Successfully built: ${portableExe}`);
    }
  } catch (err) {
    console.warn(`   ⚠ Could not build executable: ${err.message}`);
  }
}

// 3. Create Windows Shortcuts (Desktop & Start Menu)
if (process.platform === 'win32' && targetExe) {
  console.log('\n3. Creating Windows shortcuts...');
  const shortcuts = [];
  
  if (process.env.USERPROFILE) {
    shortcuts.push({
      name: 'Desktop Shortcut',
      path: path.join(process.env.USERPROFILE, 'Desktop', 'Hangly.lnk')
    });
  }

  if (process.env.APPDATA) {
    const startMenuDir = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs');
    shortcuts.push({
      name: 'Start Menu Shortcut',
      path: path.join(startMenuDir, 'Hangly.lnk')
    });
  }

  for (const sc of shortcuts) {
    try {
      const psCommand = `powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('${sc.path}'); $s.TargetPath = '${targetExe}'; $s.WorkingDirectory = '${rootDir}'; $s.Description = 'Hangly - A tiny piece of motion for your desktop'; if (Test-Path '${iconPath}') { $s.IconLocation = '${iconPath}' }; $s.Save()"`;
      execSync(psCommand, { stdio: 'ignore' });
      console.log(`   ✓ Created ${sc.name}: ${sc.path}`);
    } catch (err) {
      console.warn(`   ⚠ Could not create ${sc.name}: ${err.message}`);
    }
  }
}

console.log('\n✓ Hangly application has been installed successfully!');
console.log('You can now launch Hangly directly from your Desktop or Start Menu.\n');
