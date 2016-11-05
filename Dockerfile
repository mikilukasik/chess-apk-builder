FROM kallikrein/cordova:5.1.1

# Replace shell with bash so we can source files
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# Set debconf to run non-interactively
RUN echo 'debconf debconf/frontend select Noninteractive' | debconf-set-selections

# Install base dependencies
RUN apt-get update && apt-get install -y -q --no-install-recommends \
        build-essential \
        libssl-dev \
        curl \
        git \
        wget \
    && rm -rf /var/lib/apt/lists/*

# ENV NVM_DIR /usr/local/nvm
# ENV NODE_VERSION 4

# # Install nvm with node and npm
# RUN curl https://raw.githubusercontent.com/creationix/nvm/v0.32.1/install.sh | bash \
#     && source $NVM_DIR/nvm.sh \
#     && nvm install $NODE_VERSION \
#     && nvm alias default $NODE_VERSION \
#     && nvm use default

# ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
# ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH


VOLUME /src
ADD . /src
WORKDIR /src


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

# Install app dependencies
COPY package.json /src/package.json
COPY chess-common/package.json /src/chess-common/package.json

RUN cd /src; npm install
RUN cd /src/chess-common; npm install
# RUN npm i nodemon -g
# Bundle app source
COPY . /src

# RUN cd /src; npm install
# RUN cd /src; cordova plugin add cordova-plugin-device

EXPOSE 5000-6000

# RUN cd /src; npm start
CMD cd /src; node -v; npm start
