'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// templateFramework: 'lodash'

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jsdoc : {
            dist : {
                src: ['constants/*.js', 'controllers/**/*.js', 'helpers/**/*.js'],
                options: {
                    destination: 'public/doc',
                    template: './node_modules/ink-docstrap/template',
                    configure: 'jsdoc.json'
                }
            }
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                'controllers/{,*/}*.js',
                'models/{,*/}*.js',
                'config/{,*/}*.js',
                'constans/{,*/}*.js',
                'routes/{,*/}*.js',
                'public/{,*/}*.js',
                'helpers/{,*/}*.js'
            ]
        }


    });

    grunt.registerTask('default', [
        'jsdoc'

    ]);
    grunt.registerTask('codeTest', [
        'jshint'

    ]);
};

