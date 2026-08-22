const fs = require('fs');
const path = require('path');

const flutterDir = 'C:\\Users\\bhave\\OneDrive\\Desktop\\splinzo';

// 1. Patch TripActivity model
const modelPath = path.join(flutterDir, 'lib/src/features/trips/domain/models/trip_activity.dart');
let modelCode = fs.readFileSync(modelPath, 'utf8');

if (!modelCode.includes('createdByUid')) {
  modelCode = modelCode.replace(
    'final String type;',
    'final String type;\n  final String? createdByUid;\n  final String? updatedBy;'
  );
  
  modelCode = modelCode.replace(
    'required this.type,',
    'required this.type,\n    this.createdByUid,\n    this.updatedBy,'
  );

  modelCode = modelCode.replace(
    "type: json['type'] as String? ?? 'activity',",
    "type: json['type'] as String? ?? 'activity',\n      createdByUid: json['createdByUid'] as String?,\n      updatedBy: json['updatedBy'] as String?,"
  );

  modelCode = modelCode.replace(
    "'type': type,",
    "'type': type,\n      if (createdByUid != null) 'createdByUid': createdByUid,\n      if (updatedBy != null) 'updatedBy': updatedBy,"
  );

  fs.writeFileSync(modelPath, modelCode);
  console.log('Patched TripActivity model');
}

// 2. Patch AddActivityScreen
const screenPath = path.join(flutterDir, 'lib/src/features/trips/presentation/screens/add_activity_screen.dart');
let screenCode = fs.readFileSync(screenPath, 'utf8');

if (!screenCode.includes('firebase_auth')) {
  screenCode = "import 'package:firebase_auth/firebase_auth.dart';\n" + screenCode;
}

if (!screenCode.includes('FirebaseAuth.instance.currentUser?.uid')) {
  screenCode = screenCode.replace(
    "type: _selectedType,",
    "type: _selectedType,\n          createdByUid: FirebaseAuth.instance.currentUser?.uid,\n          updatedBy: FirebaseAuth.instance.currentUser?.uid,"
  );
  fs.writeFileSync(screenPath, screenCode);
  console.log('Patched AddActivityScreen');
}
