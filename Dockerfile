FROM kallikrein/cordova:5.1.1

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get -qq update
RUN apt-get -qq install curl

# TODO could uninstall some build dependencies

# debian installs `node` as `nodejs`
# RUN update-alternatives --install /usr/bin/node node /usr/bin/nodejs 10

# VOLUME ["/data"]
# RUN cd /data && npm install

VOLUME /src
ADD . /src
WORKDIR /src


EXPOSE  5000
# WORKDIR /data



RUN \
apt-get update && \
apt-get install -y lib32stdc++6 lib32z1

# download and extract android sdk
RUN curl http://dl.google.com/android/android-sdk_r24.2-linux.tgz | tar xz -C /usr/local/
ENV ANDROID_HOME /usr/local/android-sdk-linux
ENV PATH $PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# update and accept licences
RUN ( sleep 5 && while [ 1 ]; do sleep 1; echo y; done ) | /usr/local/android-sdk-linux/tools/android update sdk --no-ui -a --filter platform-tool,build-tools-22.0.1,android-22; \
    find /usr/local/android-sdk-linux -perm 0744 | xargs chmod 755

ENV GRADLE_USER_HOME /src/gradle




RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN apt-get -qq update
RUN apt-get install -y nodejs
# RUN cd /src && git clone https://github.com/mikilukasik/chessIonic.git && cd chessIonic && cordova platform add android #




CMD nodejs -v

#####  STILL NODE 0.1!!!!!!!!!!!

CMD cd /src && node -v && npm i && npm start