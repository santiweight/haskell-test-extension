module Main (main) where

import Test.Tasty
import Test.Tasty.HUnit (testCase, (@?=))
import GHC.Stack

main :: IO ()
main = defaultMain foo

foo :: HasCallStack => TestTree
foo =
  testGroup
    "foo"
    [ testCase "bar" $ 1 @?= 2,
      testCase "baz" $ 1 @?= 1
    ]