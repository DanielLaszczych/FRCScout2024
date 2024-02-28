// (function () {
//     // Create the connector object
//     var myConnector = tableau.makeConnector();

//     // Define the schema
//     myConnector.getSchema = function (schemaCallback) {
//         var cols = [
//             {
//                 id: 'teamNumber',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'matchNumber',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'matchIndex',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'scouter',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'station',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'preloadedPiece',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'startingPositionX',
//                 dataType: tableau.dataTypeEnum.float,
//             },
//             {
//                 id: 'startingPositionY',
//                 dataType: tableau.dataTypeEnum.float,
//             },
//             {
//                 id: 'bottomConeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleConeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topConeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'bottomCubeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleCubeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topCubeAuto',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'crossCommunity',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'chargeAuto',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'chargeAutoComment',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'standAutoComment',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'bottomConeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleConeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topConeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'bottomCubeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleCubeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topCubeTele',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'bottomConeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleConeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topConeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'bottomCubeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'middleCubeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'topCubeTeleMissed',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'chargeTele',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'chargeRobotCount',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'standChargeComment',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'defendedBy',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'loseCommunication',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'robotBreak',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'yellowCard',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'redCard',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'defenseRating',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'defenseAllocation',
//                 dataType: tableau.dataTypeEnum.float,
//             },
//             {
//                 id: 'quickness',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'driverAwareness',
//                 dataType: tableau.dataTypeEnum.int,
//             },
//             {
//                 id: 'driveTrain',
//                 dataType: tableau.dataTypeEnum.string,
//             },
//             {
//                 id: 'freeSpeed',
//                 dataType: tableau.dataTypeEnum.float,
//             },
//             {
//                 id: 'pushingPower',
//                 dataType: tableau.dataTypeEnum.float,
//             },
//         ];

//         var tableSchema = {
//             id: 'matchData',
//             alias: 'Match Forms',
//             columns: cols,
//         };

//         schemaCallback([tableSchema]);
//     };

//     // Download the data
//     myConnector.getData = function (table, doneCallback) {
//         let tableData = [];
//         let connectionData = JSON.parse(tableau.connectionData);
//         fetch(`/matchData/getTableauEventData/${connectionData.eventKey}/${tableau.password}`)
//             .then((response) => response.json())
//             .then((data) => {
//                 if (!data.Error) {
//                     for (let i = 0; i < data.length; i++) {
//                         let incompleteSuperForm = data[i].superStatus !== 'Complete' ? null : true;
//                         tableData.push({
//                             teamNumber: data[i].teamNumber,
//                             matchNumber: data[i].matchNumber,
//                             matchIndex: data[i].matchIndex,
//                             scouter: data[i].standScouter,
//                             station: data[i].station,
//                             preloadedPiece: data[i].preloadedPiece,
//                             startingPositionX: data[i].startingPosition.x,
//                             startingPositionY: data[i].startingPosition.y,
//                             bottomConeAuto: data[i].bottomAuto.coneScored,
//                             middleConeAuto: data[i].middleAuto.coneScored,
//                             topConeAuto: data[i].topAuto.coneScored,
//                             bottomCubeAuto: data[i].bottomAuto.cubeScored,
//                             middleCubeAuto: data[i].middleAuto.cubeScored,
//                             topCubeAuto: data[i].topAuto.cubeScored,
//                             crossCommunity: data[i].crossCommunity,
//                             chargeAuto: data[i].chargeAuto,
//                             chargeAutoComment: data[i].autoChargeComment,
//                             standAutoComment: data[i].standAutoComment,
//                             bottomConeTele: data[i].bottomTele.coneScored,
//                             middleConeTele: data[i].middleTele.coneScored,
//                             topConeTele: data[i].topTele.coneScored,
//                             bottomCubeTele: data[i].bottomTele.cubeScored,
//                             middleCubeTele: data[i].middleTele.cubeScored,
//                             topCubeTele: data[i].topTele.cubeScored,
//                             bottomConeTeleMissed: data[i].bottomTele.coneMissed,
//                             middleConeTeleMissed: data[i].middleTele.coneMissed,
//                             topConeTeleMissed: data[i].topTele.coneMissed,
//                             bottomCubeTeleMissed: data[i].bottomTele.cubeMissed,
//                             middleCubeTeleMissed: data[i].middleTele.cubeMissed,
//                             topCubeTeleMissed: data[i].topTele.cubeMissed,
//                             chargeTele: data[i].chargeTele,
//                             chargeRobotCount: data[i].chargeRobotCount,
//                             standChargeComment: data[i].chargeComment,
//                             defendedBy: data[i].defendedBy,
//                             loseCommunication: data[i].loseCommunication,
//                             robotBreak: data[i].robotBreak,
//                             yellowCard: data[i].yellowCard,
//                             redCard: data[i].redCard,
//                             defenseRating: incompleteSuperForm && (data[i].defenseRating > 0 ? data[i].defenseRating : null),
//                             defenseAllocation: incompleteSuperForm && (data[i].defenseRating > 0 ? data[i].defenseAllocation : null),
//                             quickness: incompleteSuperForm && data[i].quickness,
//                             driverAwareness: incompleteSuperForm && data[i].driverAwareness,
//                             driveTrain: data[i].driveTrain,
//                             freeSpeed: data[i].freeSpeed,
//                             pushingPower: data[i].pushingPower,
//                         });
//                     }
//                     table.appendRows(tableData);
//                     doneCallback();
//                 } else {
//                     table.appendRows(tableData);
//                     doneCallback();
//                 }
//             })
//             .catch(() => {
//                 table.appendRows(tableData);
//                 doneCallback();
//             });
//         // $.getJSON('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson', function (resp) {
//         //     var feat = resp.features,
//         //         tableData = [];
//         //     // Iterate over the JSON object
//         //     for (var i = 0, len = feat.length; i < len; i++) {
//         //         tableData.push({
//         //             id: feat[i].id,
//         //             mag: feat[i].properties.mag,
//         //             title: feat[i].properties.title,
//         //             location: feat[i].geometry,
//         //         });
//         //     }
//         //     table.appendRows(tableData);
//         //     doneCallback();
//         // });
//     };

//     tableau.registerConnector(myConnector);
//     // Create event listeners for when the user submits the form
// })();
