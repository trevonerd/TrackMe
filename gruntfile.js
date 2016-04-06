/**
 * Created by Marco Trevisani <marco.trevisani81@gmail.com> on 6/4/2016.
 */
module.exports = function(grunt) {

    grunt.initConfig({
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
            options: {
                globals: {
                    jQuery: true
                },
                reporter: require('jshint-stylish')
            }
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        },
        jsdoc : {
            dist : {
                src: ['src/*.js', 'test/*.js', 'README.md'],
                options: {
                    destination: 'doc',
                    template : "node_modules/ink-docstrap/template",
                    configure : "jsdoc.conf.json"
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.registerTask('default', ['jshint', 'jsdoc']);
    grunt.registerTask('doc', ['jsdoc']);

};