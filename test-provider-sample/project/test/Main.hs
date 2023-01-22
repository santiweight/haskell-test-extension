module Main (main) where

import Test.Tasty
import Test.Tasty.HUnit (testCase)
import Test.Tasty.Hspec (testSpec)

main :: IO ()
main = defaultMain foo

foo :: TestTree
foo = testGroup "foo" [testCase "bar" $ pure ()]