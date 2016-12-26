(function() {
  let pollId = window.location.href.substring(
    window.location.href.lastIndexOf('/') + 1);

  $.get('/boxes/' + pollId, function(data) {
    let questions = JSON.parse(data);
    console.log(data);
    let title = $('#debate-title');
    let question = $('#question');
    let options = $('input[name=options]');
    let reason = $('#opinion-area');
    let issue = questions[0];
    let counter = 0;
    let currQ = questions[counter];

    let userId = '';
    // Do a post to /user so we are able to log their ip address once to put questions in the database
    $.ajax({
      type: 'POST',
      url: '/user/' + pollId,
      data: {
        userId: userId,
      },
      success: function(data) {
        console.log('id: ' + data);
        userId = data;
      },
      error: function(data) {
        console.log('Error in user post: ', data);
      },
    });

    let dynamicCounter;
    let currConflictSet;

    let dynamicData = {
      questions: [questions], // questions to update answers for,
                              // initialised to be all questions with head as first value
      nextLevel: 0, // next level to be searched for inconsistencies
      userId: userId,
    };
    let isArgSupported;
    $('#finalQ').hide();
    title.html(issue.text);
    let num = parseInt(currQ.id) + 1;
    question.html(num + ': ' + currQ.text);
    setNavList();
    setActive([counter]);

    $('input[name="options"]').change(function(e) {
      e.preventDefault();
      setTimeout(changeQuestion, 500);
    });

    $('#nextQ').click(function(e) {
      e.preventDefault();
      changeQuestion();
    });

    $('#finalQ').click(function(e) {
      e.preventDefault();
      currQ.support = options.filter(':checked').val();
      currQ.reason = reason.val();

      if (currQ.support) {
        $('#vote-yes').prop('checked', currQ.support === 'yes');
        $('#vote-no').prop('checked', currQ.support === 'no');
      } else {
        $('#vote-yes').prop('checked', false);
        $('#vote-no').prop('checked', false);
      }

      if (allAnswered(questions)) {

        // Send this ajax post for first answers and receive inconsistencies from first level
        submitDynamicData();



      }

    });
    // A modal will pop up with dynamic questions from data obj
    // on last round of dynamic questions modal will show submit
    // window.location.href = '/results/' + data;
    $('#dynamicQuestionSubmit').click(function() {
      index = findCurrConflictIndex();

      console.log(index);
      let j = 0;
      for (let i = 0; i < dynamicData.questions[0].length; i++) {

        if(parseInt(dynamicData.questions[0][i].parent) == index){
          if(isArgSupported && dynamicData.questions[0][i].type == "Pro" ||
          !isArgSupported && dynamicData.questions[0][i].type == "Con"){
              j++;
              if($('#q'+ j +'-yes').is(':checked')) {
                checked = "yes";
              } else {
                checked = "no";
              }

              dynamicData.questions[0][i].support = checked;
            }

        }
      }
      addDynamicArgument(index);
      console.log(dynamicData);
      // Send this ajax post when we want inconsistencies for next level
      submitDynamicData();

    });

    //this argument must be added as a child to the parent argument
    function addDynamicArgument(index){


    }



    function findCurrConflictIndex(){
      let result = 0;
       for (i = 0; i < dynamicData.questions.length; i++) {
          if(dynamicData.questions[i].text == currConflictSet[0].text){
            result = i;
            break;
          }
       }

       return result;

    }



    $('#nav-list a').click(function(e) {
      counter = parseInt(e.currentTarget.text) - 2;
      changeQuestion();
    });

     /*
      we want dynamic questions to be a list of nodes with one head node followed by its supporters/attackers
      and we want the Box object to contain a vote field to make figuring out what type of dyanmic q
      */

     function submitDynamicData() {
      console.log("submitDyanmicData()");
      dynamicData.userId = userId;
      console.log(dynamicData);
      $.ajax({
        type: 'POST',
        url: '/answers/' + pollId,
        data: JSON.stringify(dynamicData),
        dataType: 'json',
        success: function(data) {
          console.log(data);
          if (data != 'STOP') {

            currConflictSet = data;
            console.log(JSON.stringify(currConflictSet));
            displayModal();

          } else {
            //window.location.href = '/results/' + pollId;
          }
        },
        error: function() {
          console.log('Error in submitting dynamic data');
        },
      });
    }

    function setNavList() {
      let nav = $('#nav-list');

      for (let i = 0; i < questions.length; i++) {
        let num = parseInt(questions[i].id) + 1;
        nav.append('<li class="waves-effect"><a ' +
        'value="' +
        questions[i].id +
        '">' +
        num +
        '</a></li>');
      }
    };

    //not using this function yet
    function allAnswered(questions) {
       let unansweredIndices = [];

       for (let i = 0; i < questions.length; i++) {
         if (questions[i].support === undefined) {
           unansweredIndices.push(i);
         }
       }
       //Highlight all the wrong questions in red
       setActive(unansweredIndices);
       return unansweredIndices.length === 0;
    }
    /*
    retrieve current conflict index
    if user if pro conflict index:
     show supporters and let user change answer for them to be pro
     allow user to change answer
     allow user to add supporting argument
    */

    function displayModal() {
      $('#questions').html('');
      if(currConflictSet[0].vote == "For") {
        conflictText = "You voted for the argument but against all of its supporting arguments.";
        supportOrAttack = "Supporting arguments:";
        sOrA = "a supporting";
        isArgSupported = true;
      } else {
        conflictText = "You voted against the argument but against all of its attacking arguments.";
        supportOrAttack = "Attacking arguments:";
        sOrA = "an attacking";
        isArgSupported = false;
      }
      $('#conflictTitle').html('CONFLICT! Your answer to "' +
        currConflictSet[0].text + '" is inconsistent with your other answers! <br>' + conflictText
        + ' Please edit your answers below:');


      for(let i = 0; i < currConflictSet.length; i++) {
        if(i==1){
          $('#questions').append("<br>" + supportOrAttack);
        }
        let support = currConflictSet[i].support;
        createQuestion(currConflictSet[i].text, i);
        $('#q' + i + '-' + support).prop('checked', true);
      }

      $('#questions').append("<br> Or add "+ sOrA +" argument that was not mentioned:");


      $('#dynamicModal').openModal({
        dismissible: false,
      });
    }

    //At the moment, we are making all red unanswered questions lose redness
    //on any question click, we want the rest to stay red until answered
    function setActive(indices) {
      let nav = $('#nav-list');
      let children = nav.children();
      children.removeClass('active');

      indices.forEach(function (index) {
        let active = children.eq(index);
        active.addClass('active');   
      });
      
    }

    function changeQuestion() {
      currQ.support = options.filter(':checked').val();
      currQ.reason = reason.val();

      if (counter > questions.length - 2) {
        return;
      }

      currQ = questions[++counter];
      var num = parseInt(currQ.id) + 1;
      question.text(num + ': ' + currQ.text);
      reason.val(currQ.reason);

      if (currQ.support) {
        $('#vote-yes').prop('checked', currQ.support === 'yes');
        $('#vote-no').prop('checked', currQ.support === 'no');
      } else {
        $('#vote-yes').prop('checked', false);
        $('#vote-no').prop('checked', false);
      }

      if (currQ.id === questions.length - 1) {
        $('#nextQ').hide();
        $('#finalQ').show();
      } else {
        $('#nextQ').show();
        $('#finalQ').hide();
      }

      setActive([counter]);
    }

    function createQuestion(question, counter) {
      let q = '<div id="' + question + '">' +
      '<p>' + question + '</p>' +
      '<input type="radio" id="q' + counter + '-yes" name="' + counter + '" value="yes">' +
      '<label for="q' + counter +'-yes">Yes</label>   &nbsp; &nbsp; &nbsp;  ' +
      '<input type="radio" id="q' + counter + '-no" name="' + counter + '" value="no">' +
      '<label for="q' + counter +'-no">No</label>' +
      '</div>';

      $('#questions').append(q);
    }
  });
})();
