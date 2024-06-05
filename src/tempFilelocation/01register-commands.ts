// import { testServer } from "../../../config.json";
// import areCommandsDifferent from "../../utils/areCommandsDifferent";
// // import getAllFiles from "../../utils/getAllFiles";
// import getApplicationCommands from "../../utils/getApplicationCommands";
// import getLocalCommands from "../../utils/getLocalCommands";
// // import consoleLog from "./consoleLog";

// export default async function registerCommands(client: any) {
//   try {
//     const localCommands = getLocalCommands();
//     const applicationCommands = await getApplicationCommands(
//       client,
//       testServer
//     );

//     for (const localCommand of localCommands) {
//       const { name, description, options } = localCommand;
//       const existingCommand = await applicationCommands.cache.find(
//         (cmd: any) => cmd.name === name
//       );

//       if (existingCommand) {
//         if (localCommand.deleted) {
//           await applicationCommands.delete(existingCommand.id);
//           console.log(`Deleted command "${name}".`);
//           continue;
//         }

//         if (areCommandsDifferent(existingCommand, localCommand)) {
//           await applicationCommands.edit(existingCommand.id, {
//             description,
//             options,
//           });

//           console.log(`Edited command "${name}".`);
//         }
//       } else {
//         if (localCommand.deleted) {
//           console.log(
//             `Skipping registering command "${name}" as it is set to delete.`
//           );
//           continue;
//         }

//         await applicationCommands.create({
//           name,
//           description,
//           options,
//         });

//         console.log(`Registered Command "${name}".`);
//       }
//     }
//   } catch (error) {
//     console.log(`There was an error: ${error}`);
//   }
// }
