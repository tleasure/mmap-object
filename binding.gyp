{
  "targets": [
    {
      "target_name": "mmap-object",
      "sources": [
        "mmap-object.cc",
        "cell.cc"
      ],
      "include_dirs": [
        # "/usr/local/include",
        "<!(node -e \"require('nan')\")"
      ],
      "cflags_cc": [
        "-Wall",
        "-Werror",
        "-O3",
        "-fexceptions",
        "-frtti",
        "-Wno-cast-function-type"
      ],
      "conditions": [
        [
          "OS=='win'", {
            "variables": {
              "include_dirs": [
                "<!(echo %BOOST_ROOT%)"
              ]
            }
          }
        ],
        [
          "OS=='linux'", {
            "variables": {
              "libraries": [
                "-lrt"
              ]
            }
          }
        ]
      ],
      "xcode_settings": {
        "MACOSX_DEPLOYMENT_TARGET": "10.9",
        "OTHER_CFLAGS": [
          "-Wno-unused-local-typedefs",
          "-stdlib=libc++"
        ],
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "GCC_ENABLE_CPP_RTTI": "-frtti"
      },
      "msvs_settings": {
        "VCLinkerTool": {
          "AdditionalLibraryDirectories": [
            "<!(echo %BOOST_ROOT%/stage/lib)"
          ]
        }
      }
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
      ]
    }
  ]
}
