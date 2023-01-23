{-# LANGUAGE CPP #-}
{-# LANGUAGE NoRebindableSyntax #-}
{-# OPTIONS_GHC -fno-warn-missing-import-lists #-}
{-# OPTIONS_GHC -w #-}
module Paths_tasty_hunit (
    version,
    getBinDir, getLibDir, getDynLibDir, getDataDir, getLibexecDir,
    getDataFileName, getSysconfDir
  ) where


import qualified Control.Exception as Exception
import qualified Data.List as List
import Data.Version (Version(..))
import System.Environment (getEnv)
import Prelude


#if defined(VERSION_base)

#if MIN_VERSION_base(4,0,0)
catchIO :: IO a -> (Exception.IOException -> IO a) -> IO a
#else
catchIO :: IO a -> (Exception.Exception -> IO a) -> IO a
#endif

#else
catchIO :: IO a -> (Exception.IOException -> IO a) -> IO a
#endif
catchIO = Exception.catch

version :: Version
version = Version [0,10,0,2] []

getDataFileName :: FilePath -> IO FilePath
getDataFileName name = do
  dir <- getDataDir
  return (dir `joinFileName` name)

getBinDir, getLibDir, getDynLibDir, getDataDir, getLibexecDir, getSysconfDir :: IO FilePath



bindir, libdir, dynlibdir, datadir, libexecdir, sysconfdir :: FilePath
bindir     = "/Users/santiagoweight/.cabal/bin"
libdir     = "/Users/santiagoweight/.cabal/lib/aarch64-osx-ghc-9.2.4/tasty-hunit-0.10.0.2-inplace"
dynlibdir  = "/Users/santiagoweight/.cabal/lib/aarch64-osx-ghc-9.2.4"
datadir    = "/Users/santiagoweight/.cabal/share/aarch64-osx-ghc-9.2.4/tasty-hunit-0.10.0.2"
libexecdir = "/Users/santiagoweight/.cabal/libexec/aarch64-osx-ghc-9.2.4/tasty-hunit-0.10.0.2"
sysconfdir = "/Users/santiagoweight/.cabal/etc"

getBinDir     = catchIO (getEnv "tasty_hunit_bindir")     (\_ -> return bindir)
getLibDir     = catchIO (getEnv "tasty_hunit_libdir")     (\_ -> return libdir)
getDynLibDir  = catchIO (getEnv "tasty_hunit_dynlibdir")  (\_ -> return dynlibdir)
getDataDir    = catchIO (getEnv "tasty_hunit_datadir")    (\_ -> return datadir)
getLibexecDir = catchIO (getEnv "tasty_hunit_libexecdir") (\_ -> return libexecdir)
getSysconfDir = catchIO (getEnv "tasty_hunit_sysconfdir") (\_ -> return sysconfdir)




joinFileName :: String -> String -> FilePath
joinFileName ""  fname = fname
joinFileName "." fname = fname
joinFileName dir ""    = dir
joinFileName dir fname
  | isPathSeparator (List.last dir) = dir ++ fname
  | otherwise                       = dir ++ pathSeparator : fname

pathSeparator :: Char
pathSeparator = '/'

isPathSeparator :: Char -> Bool
isPathSeparator c = c == '/'
