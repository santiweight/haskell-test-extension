import * as vscode from 'vscode';
import { ExecOptions, exec } from 'child_process';

import { getContentFromFilesystem, MarkdownTestData, TestCase, testData, TestFile } from './testTree';

console.log('here')
const testItemData: Map<vscode.TestItem, vscode.Uri> = new Map()
export async function activate(context: vscode.ExtensionContext) {
  const ctrl = vscode.tests.createTestController('haskellTestController', 'Haskell Tests');
  context.subscriptions.push(ctrl);
  // console.log(vscode.workspace.workspaceFolders);
  discoverHaskellTests(ctrl)

  console.log('activate')
  const runHandler = (request: vscode.TestRunRequest, cancellation: vscode.CancellationToken) => {
    const run = ctrl.createTestRun(request)
    if (request.include === undefined) {
      throw "bad"
    }
    var [testItem] = request.include
    console.log(testItem.id)
    console.log(request.include)

    const workspaceFolder = testItemData.get(testItem) as vscode.Uri
    exec(`cabal test --verbose=0 --test-options='-p ${testItem.id}' --test-show-details=direct`, { cwd: workspaceFolder.fsPath + "/sample/project"}, (err, stdout, stderr) => {
      if (err) {
        console.log("bad")
        console.log(err)
        run.failed(testItem, new vscode.TestMessage("failed"))
      }
      else {
        console.log(stdout)
        run.passed(testItem)

      }
    });
    // request.include
  }
  //   console.log('in run handler')
  //   discoverHaskellTests(ctrl)
  //   run_tests()
  //   const queue: { test: vscode.TestItem; data: TestCase }[] = [];
  //   const run = ctrl.createTestRun(request);
  //   // map of file uris to statements on each line:
  //   const coveredLines = new Map</* file uri */ string, (vscode.StatementCoverage | undefined)[]>();

  //   // const discoverTests = async (tests: Iterable<vscode.TestItem>) => {
  //   //   for (const test of tests) {
  //   //     if (request.exclude?.includes(test)) {
  //   //       continue;
  //   //     }

  //   //     const data = testData.get(test);
  //   //     if (data instanceof TestCase) {
  //   //       run.enqueued(test);
  //   //       queue.push({ test, data });
  //   //     } else {
  //   //       if (data instanceof TestFile && !data.didResolve) {
  //   //         await data.updateFromDisk(ctrl, test);
  //   //       }

  //   //       await discoverTests(gatherTestItems(test.children));
  //   //     }

  //   //     if (test.uri && !coveredLines.has(test.uri.toString())) {
  //   //       try {
  //   //         const lines = (await getContentFromFilesystem(test.uri)).split('\n');
  //   //         coveredLines.set(
  //   //           test.uri.toString(),
  //   //           lines.map((lineText, lineNo) =>
  //   //             lineText.trim().length ? new vscode.StatementCoverage(0, new vscode.Position(lineNo, 0)) : undefined
  //   //           )
  //   //         );
  //   //       } catch {
  //   //         // ignored
  //   //       }
  //   //     }
  //   //   }
  //   // };

  //   const runTestQueue = async () => {
  //     for (const { test, data } of queue) {
  //       run.appendOutput(`Running ${test.id}\r\n`);
  //       if (cancellation.isCancellationRequested) {
  //         run.skipped(test);
  //       } else {
  //         run.started(test);
  //         await data.run(test, run);
  //       }

  //       const lineNo = test.range!.start.line;
  //       const fileCoverage = coveredLines.get(test.uri!.toString());
  //       if (fileCoverage) {
  //         fileCoverage[lineNo]!.executionCount++;
  //       }

  //       run.appendOutput(`Completed ${test.id}\r\n`);
  //     }

  //     run.end();
  //   };

  //   run.coverageProvider = {
  //     provideFileCoverage() {
  //       const coverage: vscode.FileCoverage[] = [];
  //       for (const [uri, statements] of coveredLines) {
  //         coverage.push(
  //           vscode.FileCoverage.fromDetails(
  //             vscode.Uri.parse(uri),
  //             statements.filter((s): s is vscode.StatementCoverage => !!s)
  //           )
  //         );
  //       }

  //       return coverage;
  //     },
  //   };

  //   // discoverTests(request.include ?? gatherTestItems(ctrl.items)).then(runTestQueue);
  // };

  ctrl.refreshHandler = async () => {
    // await Promise.all(getWorkspaceTestPatterns().map(({ pattern }) => findInitialFiles(ctrl, pattern)));
    discoverHaskellTests(ctrl)
  };


  ctrl.createRunProfile('Run Haskell Tests', vscode.TestRunProfileKind.Run, runHandler, true);

  ctrl.resolveHandler = async item => {
    discoverHaskellTests(ctrl)

    // if (!item) {
    // 	context.subscriptions.push(...startWatchingWorkspace(ctrl));
    // 	return;
    // }

    // const data = testData.get(item);
    // if (data instanceof TestFile) {
    // 	await data.updateFromDisk(ctrl, item);
    // }
  };

  function updateNodeForDocument(e: vscode.TextDocument) {
    if (e.uri.scheme !== 'file') {
      return;
    }

    if (!e.uri.path.endsWith('.md')) {
      return;
    }

    const { file, data } = getOrCreateFile(ctrl, e.uri);
    // data.updateFromContents(ctrl, e.getText(), file);
  }

  // for (const document of vscode.workspace.textDocuments) {
  //   updateNodeForDocument(document);
  // }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(updateNodeForDocument),
    vscode.workspace.onDidChangeTextDocument(e => updateNodeForDocument(e.document)),
  );
}

function getOrCreateFile(controller: vscode.TestController, uri: vscode.Uri) {
  const existing = controller.items.get(uri.toString());
  if (existing) {
    return { file: existing, data: testData.get(existing) as TestFile };
  }

  const file = controller.createTestItem(uri.toString(), uri.path.split('/').pop()!, uri);
  controller.items.add(file);

  const data = new TestFile();
  testData.set(file, data);

  file.canResolveChildren = true;
  return { file, data };
}

function gatherTestItems(collection: vscode.TestItemCollection) {
  const items: vscode.TestItem[] = [];
  collection.forEach(item => items.push(item));
  return items;
}

function getWorkspaceTestPatterns() {
  if (!vscode.workspace.workspaceFolders) {
    return [];
  }

  return vscode.workspace.workspaceFolders.map(workspaceFolder => ({
    workspaceFolder,
    pattern: new vscode.RelativePattern(workspaceFolder, '**/*.md'),
  }));
}

async function findInitialFiles(controller: vscode.TestController, pattern: vscode.GlobPattern) {
  for (const file of await vscode.workspace.findFiles(pattern)) {
    getOrCreateFile(controller, file);
  }
}

function startWatchingWorkspace(controller: vscode.TestController) {
  discoverHaskellTests(controller);
  return getWorkspaceTestPatterns().map(({ workspaceFolder, pattern }) => {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);

    watcher.onDidCreate(uri => getOrCreateFile(controller, uri));
    watcher.onDidChange(uri => {
      const { file, data } = getOrCreateFile(controller, uri);
      if (data.didResolve) {
        data.updateFromDisk(controller, file);
      }
    });
    watcher.onDidDelete(uri => controller.items.delete(uri.toString()));

    findInitialFiles(controller, pattern);
    discoverHaskellTests(controller);

    return watcher;
  });
}


function discoverHaskellTests(ctrl: vscode.TestController) {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  console.log("running tests")
  for (const workspaceFolder of workspaceFolders) {
    // console.log(workspaceFolder)
    exec(`ls`, { cwd: workspaceFolder.uri.fsPath + "/sample/project" }, (err, stdout, stderr) => {
      if (err) {
        console.log("bad")
        console.log(err)
      }
      console.log(stdout);
    });
    exec(`cabal test --verbose=0 --test-options='--tree-info' --test-show-details=direct`, { cwd: workspaceFolder.uri.fsPath + "/sample/project"}, (err, stdout, stderr) => {
      if (err) {
        console.log("bad")
        console.log(err)
      }
      // console.log("stdout", stdout);
      // console.log("stdout", stdout.split('\n').filter(str => str.length > 0));
      // console.log("stdout", stdout);
      const tests = stdout.split('\n')
      // console.log("tests", tests)
      // type TestSuite = { name: string, testTree: TestTree }

      const testTreeInfoResult = JSON.parse(stdout) as TestTreeInfoResult
      console.log("parsed", JSON.parse(stdout) as TestTreeInfoResult)
      const collectTestItems = (path: string, testTreeInfo: TestTreeInfoResult) => {
        console.log("collecting")
        if (testTreeInfo.tag === "TestCaseInfo") {
          console.log("test case", testTreeInfo)
          console.log("workspace folder", workspaceFolder)
          const fullPath = path.length === 0 ? testTreeInfo.name : path + "." + testTreeInfo.name
          const testItem = ctrl.createTestItem(fullPath, testTreeInfo.name, vscode.Uri.joinPath(workspaceFolder.uri, testTreeInfo.loc.file));
          testItemData.set(testItem, workspaceFolder.uri)
          return testItem
        }
        else if (testTreeInfo.tag === "TestGroupInfo") {
          console.log("test group", testTreeInfo)
          const fullPath = path.length === 0 ? testTreeInfo.name : path + "." + testTreeInfo.name
          const childs = testTreeInfo.children.map((child: TestTreeInfoResult) => collectTestItems(fullPath, child));
          const groupItem = ctrl.createTestItem(fullPath, testTreeInfo.name);
          childs.forEach(child => groupItem.children.add(child))
          testItemData.set(groupItem, workspaceFolder.uri)
          return groupItem;
        } else {
          throw "bad"
        }

      }
      ctrl.items.add(collectTestItems("", testTreeInfoResult))
    });
  }
}
interface TestLoc { file: string, line: number, column: number, tag: "TestLoc" };
type TestTreeInfoResult =
  | TestCaseInfo
  | TestGroupInfo;
interface TestCaseInfo { name: string, loc: TestLoc, tag: "TestCaseInfo" };
interface TestGroupInfo { name: string, loc: TestLoc, children: [TestTreeInfoResult], tag: "TestGroupInfo" };

function run_tests() {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return;
  }
  console.log("running tests")
  for (const workspaceFolder of workspaceFolders) {
    console.log(workspaceFolder)
    exec(`ls`, { cwd: workspaceFolder.uri.fsPath }, (err, stdout, stderr) => {
      if (err) {
        console.log("bad")
        console.log(err)
      }
      console.log(stdout);
    });
    exec(`cabal test --verbose=0 --test-options='--tree-info' --test-show-details=direct`, { cwd: workspaceFolder.uri.fsPath + "" }, (err, stdout, stderr) => {
      if (err) {
        console.log("bad")
        console.log(err)
      }
      console.log(stdout);
    });
  }
}