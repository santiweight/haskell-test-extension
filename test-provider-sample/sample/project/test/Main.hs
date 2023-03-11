{-# LANGUAGE RankNTypes #-}
module Main (main) where

import Test.Tasty
import Test.Tasty.HUnit (testCase, (@?=))
import GHC.Stack

type TestTree' = HasCallStack => TestTree

idTestTree :: TestTree' -> TestTree
idTestTree = id

main :: IO ()
main = defaultMain foo

foo :: TestTree'
foo =
  testGroup
    "foo"
    [ testCase "bar" $ 1 @?= 2,
      testCase "baz" $ 1 @?= 1
    ]